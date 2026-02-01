# 🔍 Comment trouver votre Project URL dans Supabase

## 📍 Où la trouver

### Méthode 1 : Dans Settings → API (recommandé)

1. **Connectez-vous** à [supabase.com](https://supabase.com)
2. **Sélectionnez votre projet** `orbitalastro`
3. **Menu de gauche** → **"Settings"** (icône ⚙️)
4. Cliquez sur **"API"** dans le sous-menu
5. En haut de la page, vous verrez une section **"Project URL"**
6. Vous verrez quelque chose comme :
   ```
   https://abcdefghijklmnop.supabase.co
   ```
7. **C'est votre Project URL !** Copiez-la complètement

### Méthode 2 : Dans Project Settings

1. **Menu de gauche** → **"Settings"** (icône ⚙️)
2. Cliquez sur **"General"** (ou "Project Settings")
3. Cherchez **"Reference ID"** ou **"Project URL"**
4. Vous verrez l'URL complète

### Méthode 3 : Dans l'URL du navigateur

Quand vous êtes dans votre projet Supabase, regardez l'URL de votre navigateur :
```
https://supabase.com/dashboard/project/abcdefghijklmnop
```
Votre Project URL sera :
```
https://abcdefghijklmnop.supabase.co
```
(Remplacez `abcdefghijklmnop` par l'ID que vous voyez dans l'URL)

## 📋 Format d'une Project URL

Une Project URL Supabase ressemble toujours à :
```
https://[ID_UNIQUE].supabase.co
```

Exemples :
- `https://abcdefghijklmnop.supabase.co`
- `https://xyz123456789.supabase.co`
- `https://orbitalastro-abc123.supabase.co`

## ⚠️ Important

- La Project URL commence **TOUJOURS** par `https://`
- Elle se termine **TOUJOURS** par `.supabase.co`
- Elle contient un ID unique au milieu (lettres et chiffres)
- **Copiez-la complètement** (du `https://` jusqu'au `.supabase.co`)

## 🎯 Où l'utiliser

Une fois que vous avez votre Project URL, utilisez-la dans cette commande :

```powershell
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJECT_URL.supabase.co -a orbitalastro-web
```

(Remplacez `VOTRE_PROJECT_URL` par votre vraie URL)

## 🆘 Si vous ne la trouvez pas

1. Vérifiez que vous êtes bien **dans votre projet** (pas sur la page d'accueil)
2. Vérifiez que vous êtes dans **Settings → API**
3. Si vous ne voyez toujours pas, essayez de rafraîchir la page (`F5`)
4. Ou cherchez dans **Settings → General**

## ✅ Vérification

Votre Project URL devrait :
- ✅ Commencer par `https://`
- ✅ Contenir un ID unique (lettres/chiffres)
- ✅ Se terminer par `.supabase.co`
- ✅ Faire environ 30-40 caractères au total

