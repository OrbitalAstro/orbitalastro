# 🔑 Comment récupérer les clés API Supabase

## 📋 Étape 1 : Accéder aux Settings

1. Dans Supabase, **menu de gauche**, cherchez **"Settings"** (icône ⚙️)
2. Cliquez sur **"Settings"**
3. Dans le sous-menu qui apparaît, cliquez sur **"API"**

## 📋 Étape 2 : Récupérer Project URL

1. Dans la page **Settings → API**, vous verrez une section **"Project URL"**
2. Vous verrez quelque chose comme :
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
3. **Copiez cette URL complète** (commence par `https://` et se termine par `.supabase.co`)
4. ⚠️ **C'est la valeur pour** `NEXT_PUBLIC_SUPABASE_URL`

## 📋 Étape 3 : Récupérer Service Role Key

1. Toujours dans **Settings → API**, descendez jusqu'à la section **"API Keys"**
2. Vous verrez plusieurs clés :
   - **`anon` `public`** : Clé publique (ne pas utiliser pour notre cas)
   - **`service_role` `secret`** : ⚠️ **C'EST CELLE-CI QU'IL FAUT**
3. À côté de **`service_role` `secret`**, vous verrez :
   - Un bouton **"Reveal"** ou **"Show"** ou un œil 👁️
   - Cliquez dessus pour révéler la clé
4. La clé commence par `eyJhbGc...` (c'est très long, ~200 caractères)
5. **Copiez TOUTE la clé** (du début à la fin)
6. ⚠️ **C'est la valeur pour** `SUPABASE_SERVICE_ROLE_KEY`
7. ⚠️ **IMPORTANT** : Cette clé est SECRÈTE, ne la partagez JAMAIS publiquement

## 📋 Étape 4 : Configurer sur Fly.io

Maintenant, vous devez configurer ces deux valeurs sur Fly.io.

### Option A : Via la ligne de commande (recommandé)

Ouvrez PowerShell ou Terminal et exécutez :

```powershell
# Remplacez les valeurs par celles que vous avez copiées
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co -a orbitalastro-web
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... -a orbitalastro-web
```

⚠️ **Important** : 
- Remplacez `https://xxxxxxxxxxxxx.supabase.co` par votre vraie Project URL
- Remplacez `eyJhbGc...` par votre vraie Service Role Key complète
- Les deux commandes doivent être exécutées une après l'autre

### Option B : Via le dashboard Fly.io

1. Allez sur [https://fly.io/dashboard](https://fly.io/dashboard)
2. Connectez-vous
3. Sélectionnez votre app **`orbitalastro-web`**
4. Dans le menu de gauche, cliquez sur **"Secrets"**
5. Cliquez sur **"Add Secret"** ou **"Set Secret"**
6. Ajoutez le premier secret :
   - **Name** : `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** : `https://xxxxxxxxxxxxx.supabase.co` (votre Project URL)
   - Cliquez sur **"Save"** ou **"Set"**
7. Répétez pour le deuxième secret :
   - **Name** : `SUPABASE_SERVICE_ROLE_KEY`
   - **Value** : `eyJhbGc...` (votre Service Role Key complète)
   - Cliquez sur **"Save"** ou **"Set"**

## ✅ Vérification

Pour vérifier que les secrets sont bien configurés :

```powershell
flyctl secrets list -a orbitalastro-web
```

Vous devriez voir :
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

(Note : Les valeurs ne seront pas affichées pour des raisons de sécurité, mais les noms seront visibles)

## 📋 Étape 5 : Redéployer l'application

Une fois les secrets configurés, redéployez :

```powershell
cd web
flyctl deploy -a orbitalastro-web
```

## 🎯 Résumé rapide

1. **Supabase** → Settings → API
2. **Copier** Project URL (`https://xxxxx.supabase.co`)
3. **Copier** Service Role Key (`eyJhbGc...`)
4. **Fly.io** → Exécuter les 2 commandes `flyctl secrets set`
5. **Redéployer** avec `flyctl deploy`

## ⚠️ Sécurité

- ⚠️ **NE JAMAIS** commiter ces clés dans Git
- ⚠️ **NE JAMAIS** les partager publiquement
- ⚠️ **NE JAMAIS** les mettre dans le code source
- ✅ **TOUJOURS** les stocker dans Fly.io secrets

## 🆘 Problèmes courants

### "Secret not found"
- Vérifiez que vous avez bien exécuté les commandes `flyctl secrets set`
- Vérifiez que vous êtes dans le bon projet (`orbitalastro-web`)

### "Invalid URL"
- Vérifiez que la Project URL commence bien par `https://`
- Vérifiez qu'elle se termine par `.supabase.co`

### "Invalid key"
- Vérifiez que vous avez copié la clé complète (elle est très longue)
- Vérifiez qu'il n'y a pas d'espaces avant/après

