# 🔍 Comment trouver VOTRE Project URL Supabase

## ⚠️ Je ne peux pas voir votre URL

Je ne peux pas connaître votre Project URL car elle est unique à votre compte Supabase. Vous devez la trouver vous-même dans votre interface Supabase.

## 📍 Où la trouver (étapes précises)

### Étape 1 : Ouvrir Supabase
1. Allez sur [https://supabase.com](https://supabase.com)
2. **Connectez-vous** avec votre compte
3. **Cliquez sur votre projet** `orbitalastro` (dans la liste des projets)

### Étape 2 : Aller dans Settings → API
1. Dans le **menu de gauche**, cherchez **"Settings"** (icône ⚙️)
2. **Cliquez sur "Settings"**
3. Dans le menu qui apparaît, **cliquez sur "API"**

### Étape 3 : Trouver Project URL
1. En haut de la page **Settings → API**, vous verrez une section qui dit **"Project URL"**
2. En dessous, vous verrez une URL qui ressemble à :
   ```
   https://abcdefghijklmnop.supabase.co
   ```
   ou
   ```
   https://xyz123456789012345.supabase.co
   ```
3. **C'est VOTRE Project URL !**

### Étape 4 : Copier
1. **Sélectionnez toute l'URL** (du `https://` jusqu'au `.supabase.co`)
2. **Copiez-la** (`Ctrl+C`)

## 🎯 À quoi ça ressemble

Votre Project URL sera quelque chose comme :
- `https://abcdefghijklmnop.supabase.co`
- `https://xyz123456789012345.supabase.co`
- `https://orbitalastro-abc123.supabase.co`
- `https://qwertyuiop123456.supabase.co`

**Chaque projet Supabase a un ID unique**, donc votre URL sera différente de ces exemples.

## 📸 Où exactement dans l'interface

```
┌─────────────────────────────────────────┐
│  Supabase Dashboard                     │
│                                         │
│  Settings → API                         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Project URL                    │   │
│  │  ┌───────────────────────────┐ │   │
│  │  │ https://xxxxx.supabase.co  │ │ ← ICI
│  │  └───────────────────────────┘ │   │
│  │  [Copy]                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  API Keys                               │
│  ...                                    │
└─────────────────────────────────────────┘
```

## ✅ Vérification

Votre Project URL doit :
- ✅ Commencer par `https://`
- ✅ Contenir un ID unique (lettres et chiffres mélangés)
- ✅ Se terminer par `.supabase.co`
- ✅ Faire environ 30-50 caractères au total

## 🆘 Si vous ne la voyez pas

1. **Vérifiez que vous êtes dans Settings → API** (pas juste Settings)
2. **Faites défiler** la page vers le haut (elle peut être en haut)
3. **Rafraîchissez** la page (`F5`)
4. **Cherchez** une section qui dit "Project URL" ou "Reference ID"

## 💡 Alternative : Dans l'URL du navigateur

Si vous êtes dans votre projet Supabase, regardez l'URL de votre navigateur :
```
https://supabase.com/dashboard/project/abcdefghijklmnop
```

Votre Project URL sera :
```
https://abcdefghijklmnop.supabase.co
```

(Remplacez `abcdefghijklmnop` par l'ID que vous voyez dans l'URL du navigateur)

## 🎯 Une fois que vous l'avez

Copiez-la et utilisez-la dans cette commande :

```powershell
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_URL_ICI.supabase.co -a orbitalastro-web
```

(Remplacez `VOTRE_URL_ICI` par votre vraie URL complète)

