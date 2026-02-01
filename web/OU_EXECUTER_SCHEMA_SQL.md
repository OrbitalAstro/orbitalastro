# 📍 Où exécuter le schéma SQL dans Supabase

## 🎯 Emplacement exact

### Étape 1 : Accéder à SQL Editor

1. **Connectez-vous** à [https://supabase.com](https://supabase.com)
2. **Sélectionnez votre projet** `orbitalastro` (ou le nom que vous avez choisi)
3. Dans le **menu de gauche**, cherchez **"SQL Editor"**
   - C'est une icône qui ressemble à `</>` ou à un éditeur de code
   - C'est généralement dans la section "Development" ou "Database"

### Étape 2 : Créer une nouvelle requête

1. Une fois dans **SQL Editor**, vous verrez :
   - Une liste de requêtes sauvegardées (à gauche, si vous en avez)
   - Un grand éditeur de texte au centre
   - Un bouton **"New query"** en haut à gauche

2. Cliquez sur **"New query"** (ou utilisez le raccourci `Ctrl+N` / `Cmd+N`)

### Étape 3 : Coller le schéma SQL

1. **Ouvrez le fichier** `web/database/schema.sql` sur votre ordinateur
   - Vous pouvez l'ouvrir avec Notepad, VS Code, ou n'importe quel éditeur de texte

2. **Sélectionnez TOUT le contenu** (`Ctrl+A` / `Cmd+A`)

3. **Copiez** (`Ctrl+C` / `Cmd+C`)

4. **Retournez dans Supabase SQL Editor**

5. **Collez** dans l'éditeur (`Ctrl+V` / `Cmd+V`)

### Étape 4 : Exécuter

1. **Vérifiez** que tout le code SQL est bien collé
2. Cliquez sur le bouton **"Run"** en bas à droite de l'éditeur
   - Ou appuyez sur `Ctrl+Enter` (Windows/Linux)
   - Ou appuyez sur `Cmd+Enter` (Mac)

### Étape 5 : Vérifier le résultat

Vous devriez voir dans la console en bas :
- ✅ `Success: Tables created`
- ✅ `Success: Indexes created`
- ✅ `Success: Triggers created`
- ✅ `Success: Functions created`

⚠️ **Si vous voyez des erreurs** :
- Si c'est "table already exists", c'est normal (ignorez)
- Si c'est autre chose, copiez l'erreur et je vous aiderai

## 📸 À quoi ça ressemble

```
┌─────────────────────────────────────────┐
│  Supabase Dashboard                     │
│                                         │
│  [Menu gauche]                          │
│  ├─ Table Editor                        │
│  ├─ SQL Editor  ← CLIQUEZ ICI          │
│  ├─ Database                            │
│  └─ ...                                 │
│                                         │
│  [Zone principale]                      │
│  ┌─────────────────────────────────┐   │
│  │  New query  [Run] [Save]        │   │
│  ├─────────────────────────────────┤   │
│  │                                 │   │
│  │  [Éditeur SQL - Collez ici]     │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Console résultats en bas]            │
└─────────────────────────────────────────┘
```

## 🎯 Chemin complet

1. **Supabase.com** → Se connecter
2. **Sélectionner le projet** `orbitalastro`
3. **Menu gauche** → **"SQL Editor"** (icône `</>`)
4. **"New query"** (bouton en haut)
5. **Coller** le contenu de `web/database/schema.sql`
6. **"Run"** (bouton en bas à droite) ou `Ctrl+Enter`

## ⚠️ Important

- Vous devez être **connecté à votre projet Supabase**
- Le fichier à copier est : `web/database/schema.sql` (sur votre ordinateur)
- Tout le contenu doit être collé d'un coup
- Cliquez sur **"Run"** pour exécuter

## 🆘 Si vous ne trouvez pas SQL Editor

1. Vérifiez que vous êtes bien dans votre projet (pas sur la page d'accueil)
2. Le menu de gauche devrait avoir plusieurs options
3. Cherchez une icône qui ressemble à `</>` ou "SQL" ou "Query"
4. Si vous ne le voyez toujours pas, essayez de rafraîchir la page (`F5`)

