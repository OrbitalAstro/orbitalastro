# Instructions de débogage

## ⚠️ Le serveur ne démarre pas - Aide-moi à diagnostiquer

Pour que je puisse vous aider, j'ai besoin de voir ce qui se passe dans votre terminal.

### 1. Ouvrez un nouveau terminal PowerShell

1. Ouvrez **PowerShell** (ou utilisez celui que vous avez déjà)
2. Naviguez vers le projet :
   ```powershell
   cd C:\Users\isabe\orbitalastro\web
   ```

### 2. Lancez le serveur ET regardez les messages

```powershell
npm run dev:fast
```

### 3. Regardez attentivement

**Cherchez** :
- ❌ Messages en **rouge** (erreurs)
- ❌ Messages d'erreur en anglais
- ❌ Messages qui commencent par "Error" ou "Failed"

### 4. Copiez les erreurs

**Copiez-collez ICI** les messages d'erreur que vous voyez dans le terminal.

## Ce que je dois voir

Exemples de ce que je dois voir pour vous aider :

```
Error: Cannot find module 'next-auth'
```

ou

```
Error: NEXTAUTH_SECRET is required
```

ou

```
SyntaxError: Unexpected token
```

## Solutions rapides à essayer

### Solution 1 : Vérifier .env.local

Dans PowerShell :
```powershell
Get-Content .env.local
```

Vous devriez voir :
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=8XEOaFMsjus77re8OAz5zeB1AqZtpOjnage8O9H7rtg=
```

### Solution 2 : Réinstaller les dépendances

```powershell
cd C:\Users\isabe\orbitalastro\web
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
npm run dev:fast
```

### Solution 3 : Vérifier que NextAuth est installé

```powershell
npm list next-auth
```

Vous devriez voir : `next-auth@4.24.x`

## Important

**Je ne peux pas voir les erreurs depuis ici** - j'ai besoin que vous me les copiiez depuis votre terminal.

Copiez-collez ici les messages d'erreur du terminal PowerShell ! 🔍

